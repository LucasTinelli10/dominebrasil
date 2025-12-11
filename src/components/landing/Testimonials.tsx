import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Aluna',
    city: 'São Paulo, SP',
    content: 'Depois de 10 anos com carteira na gaveta, finalmente consigo dirigir! O instrutor teve toda paciência que eu precisava.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Carlos Oliveira',
    role: 'Instrutor',
    city: 'Rio de Janeiro, RJ',
    content: 'A plataforma mudou minha vida profissional. Trabalho no meu horário e tenho uma renda muito melhor que na autoescola.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Ana Costa',
    role: 'Investidora',
    city: 'Curitiba, PR',
    content: 'Tenho 3 carros na plataforma e a renda passiva é excelente. Pagamento sempre em dia e sem dor de cabeça.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section id="depoimentos" className="py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que dizem sobre nós
          </h2>
          <p className="text-lg text-muted-foreground">
            Histórias reais de pessoas que transformaram suas vidas com o DomineBrasil.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />
              
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role} • {testimonial.city}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-warning fill-warning" />
                ))}
              </div>
              
              <p className="text-muted-foreground">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
