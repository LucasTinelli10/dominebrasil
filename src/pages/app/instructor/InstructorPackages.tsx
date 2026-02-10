import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Package,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  BookOpen,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BUSINESS_RULES, formatCurrency } from '@/lib/businessRules';

interface InstructorPackage {
  id: string;
  instructor_id: string;
  name: string;
  price: number;
  lesson_count: number;
  includes_exam: boolean;
  active: boolean;
}

const EXAM_HOURS = 4;

export default function InstructorPackages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<InstructorPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVehicleOwner, setIsVehicleOwner] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<InstructorPackage | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formLessonCount, setFormLessonCount] = useState('1');
  const [formIncludesExam, setFormIncludesExam] = useState(false);
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [packagesRes, detailsRes] = await Promise.all([
        supabase
          .from('instructor_packages')
          .select('*')
          .eq('instructor_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('instructors_details')
          .select('is_vehicle_owner')
          .eq('profile_id', user!.id)
          .single(),
      ]);

      setPackages((packagesRes.data as unknown as InstructorPackage[]) || []);
      setIsVehicleOwner(detailsRes.data?.is_vehicle_owner ?? false);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingPackage(null);
    setFormName('');
    setFormPrice('');
    setFormLessonCount('1');
    setFormIncludesExam(false);
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (pkg: InstructorPackage) => {
    setEditingPackage(pkg);
    setFormName(pkg.name);
    setFormPrice(pkg.price.toString());
    setFormLessonCount(pkg.lesson_count.toString());
    setFormIncludesExam(pkg.includes_exam);
    setFormActive(pkg.active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const price = parseFloat(formPrice);
    const lessonCount = parseInt(formLessonCount);

    if (!formName.trim()) {
      toast.error('Informe o nome do pacote');
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error('Informe um preço válido');
      return;
    }
    if (isNaN(lessonCount) || lessonCount <= 0) {
      toast.error('Informe a quantidade de aulas');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        instructor_id: user!.id,
        name: formName.trim(),
        price,
        lesson_count: lessonCount,
        includes_exam: formIncludesExam,
        active: formActive,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('instructor_packages')
          .update(payload)
          .eq('id', editingPackage.id);
        if (error) throw error;
        toast.success('Pacote atualizado!');
      } else {
        const { error } = await supabase
          .from('instructor_packages')
          .insert(payload);
        if (error) throw error;
        toast.success('Pacote criado!');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar pacote', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('instructor_packages')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Pacote removido');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao remover', { description: error.message });
    }
  };

  const handleToggleActive = async (pkg: InstructorPackage) => {
    try {
      const { error } = await supabase
        .from('instructor_packages')
        .update({ active: !pkg.active })
        .eq('id', pkg.id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao atualizar', { description: error.message });
    }
  };

  // Calculate rental cost warning
  const rentalHours = parseInt(formLessonCount || '0') + (formIncludesExam ? EXAM_HOURS : 0);
  const rentalCost = rentalHours * BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR;
  const formPriceNum = parseFloat(formPrice || '0');
  const platformFee = formPriceNum * 0.15;
  const totalDeductions = platformFee + (!isVehicleOwner ? rentalCost : 0);
  const netProfit = formPriceNum - totalDeductions;
  const suggestedMinPrice = Math.ceil(((!isVehicleOwner ? rentalCost : 0) + 10) / 0.85); // 15% fee + rental + R$10 min profit

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-instructor" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Meus Preços e Pacotes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie pacotes personalizados para seus alunos
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-instructor hover:bg-instructor/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Pacote
        </Button>
      </div>

      {/* Vehicle owner status */}
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Status do veículo</p>
              <p className="text-xs text-muted-foreground">
                {isVehicleOwner
                  ? 'Você usa seu próprio veículo — sem custo de aluguel'
                  : `Instrutor parceiro — aluguel de R$${BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR}/hora será descontado`}
              </p>
            </div>
          </div>
          <Badge variant={isVehicleOwner ? 'default' : 'secondary'}>
            {isVehicleOwner ? 'Dono do Carro' : 'Parceiro'}
          </Badge>
        </CardContent>
      </Card>

      {/* Packages list */}
      {packages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum pacote criado</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie pacotes personalizados para que alunos possam contratá-los
            </p>
            <Button onClick={openCreateDialog} className="bg-instructor hover:bg-instructor/90">
              <Plus className="h-4 w-4 mr-2" /> Criar Primeiro Pacote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const pkgRentalHours = pkg.lesson_count + (pkg.includes_exam ? EXAM_HOURS : 0);
            const pkgRentalCost = !isVehicleOwner ? pkgRentalHours * BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR : 0;
            const pkgPlatformFee = pkg.price * 0.15;
            const pkgNet = pkg.price - pkgPlatformFee - pkgRentalCost;

            return (
              <Card key={pkg.id} className={!pkg.active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{pkg.name}</CardTitle>
                      <Badge variant={pkg.active ? 'default' : 'secondary'} className="mt-1 text-xs">
                        {pkg.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(pkg)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(pkg.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(pkg.price)}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{pkg.lesson_count} aula(s) de 50min</span>
                    </div>
                    {pkg.includes_exam && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-instructor" />
                        <span>Inclui acompanhamento no exame</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Taxa Domine (15%)</span>
                      <span>-{formatCurrency(pkgPlatformFee)}</span>
                    </div>
                    {pkgRentalCost > 0 && (
                      <div className="flex justify-between">
                        <span>Aluguel ({pkgRentalHours}h)</span>
                        <span>-{formatCurrency(pkgRentalCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-foreground text-sm pt-1">
                      <span>Seu lucro</span>
                      <span className={pkgNet < 0 ? 'text-destructive' : 'text-success'}>
                        {formatCurrency(pkgNet)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Switch
                      checked={pkg.active}
                      onCheckedChange={() => handleToggleActive(pkg)}
                    />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {pkg.active ? 'Visível para alunos' : 'Oculto'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Editar Pacote' : 'Novo Pacote'}</DialogTitle>
            <DialogDescription>
              Defina o nome, preço e o que está incluso no pacote
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pkg-name">Nome do Pacote</Label>
              <Input
                id="pkg-name"
                placeholder="Ex: Pacote Exame, Combo 10 Aulas"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-price">Preço (R$)</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0,00"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-lessons">Qtd. de Aulas (50min)</Label>
                <Input
                  id="pkg-lessons"
                  type="number"
                  min="1"
                  max="50"
                  value={formLessonCount}
                  onChange={(e) => setFormLessonCount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <Switch
                id="pkg-exam"
                checked={formIncludesExam}
                onCheckedChange={setFormIncludesExam}
              />
              <div>
                <Label htmlFor="pkg-exam" className="cursor-pointer font-medium">
                  Inclui acompanhamento no exame
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bloqueia o carro por 4 horas no dia da prova
                </p>
              </div>
            </div>

            {/* Smart Warning for non-vehicle-owner with exam */}
            {!isVehicleOwner && formIncludesExam && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Atenção: Custo de aluguel elevado</p>
                  <p className="text-muted-foreground mt-1">
                    O exame bloqueia o carro por 4 horas. O custo de aluguel será descontado automaticamente.
                    Sugerimos cobrar acima de <strong>{formatCurrency(suggestedMinPrice)}</strong> para ter lucro.
                  </p>
                </div>
              </div>
            )}

            {/* Profit Preview */}
            {formPriceNum > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2 text-sm">
                  <p className="font-semibold text-foreground">Simulação de Lucro</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço do pacote</span>
                    <span>{formatCurrency(formPriceNum)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Taxa Domine (15%)</span>
                    <span>-{formatCurrency(platformFee)}</span>
                  </div>
                  {!isVehicleOwner && rentalCost > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Aluguel ({rentalHours}h × R${BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR})</span>
                      <span>-{formatCurrency(rentalCost)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Seu lucro líquido</span>
                    <span className={netProfit < 0 ? 'text-destructive' : 'text-success'}>
                      {formatCurrency(netProfit)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center space-x-3">
              <Switch
                id="pkg-active"
                checked={formActive}
                onCheckedChange={setFormActive}
              />
              <Label htmlFor="pkg-active">Pacote ativo (visível para alunos)</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-instructor hover:bg-instructor/90"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPackage ? 'Salvar' : 'Criar Pacote'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
