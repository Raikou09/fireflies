import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: 'cricket' | 'football' | 'basketball' | 'theatre' | 'concert';
  capacity: number;
  sections: Array<{ name: string; color: string; basePrice: number }>;
}

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onCustomDesign: () => void;
}

const categoryIcons: Record<string, string> = {
  cricket: "🏏",
  football: "⚽",
  basketball: "🏀",
  theatre: "🎭",
  concert: "🎸",
};

export function TemplateSelector({ onSelectTemplate, onCustomDesign }: TemplateSelectorProps) {
  const { data: templates, isLoading } = useQuery<TemplateInfo[]>({
    queryKey: ['/api/venue-templates'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="template-selector-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="template-selector">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose How to Design Your Venue</h3>
        <p className="text-sm text-muted-foreground">
          Select a professional template or design from scratch
        </p>
      </div>

      {/* Custom Design Option */}
      <Card 
        className="border-2 border-dashed hover:border-primary cursor-pointer transition-colors"
        onClick={onCustomDesign}
        data-testid="card-custom-design"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Design from Scratch
          </CardTitle>
          <CardDescription>
            Create a completely custom seat layout with full control over sections and seats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" data-testid="button-custom-design">
            Start Custom Design
          </Button>
        </CardContent>
      </Card>

      {/* Template Options */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <span>Professional Templates</span>
          <Badge variant="secondary">{templates?.length || 0} available</Badge>
        </h4>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {templates?.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-md transition-shadow"
                data-testid={`card-template-${template.id}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{categoryIcons[template.category]}</span>
                      {template.name}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {template.category}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {template.capacity.toLocaleString()} seats</span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Sections:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.sections.map((section, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${section.color}20`,
                            borderColor: section.color,
                          }}
                          data-testid={`badge-section-${template.id}-${idx}`}
                        >
                          {section.name} - KES {section.basePrice}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="default"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template.id);
                    }}
                    data-testid={`button-select-${template.id}`}
                  >
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
