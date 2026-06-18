export interface Trend {
  topic: string;
  category: string;
  keywords: string[];
  score: number;
  source: string;
  trendContext?: string;
}

export interface TemplateConcept {
  emoji: string;
  label: string;
  style: string;
  cat: string;
  prompt: string;
}

export interface TrendSource {
  getTrendingTopics(): Promise<Trend[]>;
}

export interface AIProvider {
  generateTemplateConcept(trend: Trend): Promise<TemplateConcept>;
  generateTemplateImage(concept: TemplateConcept): Promise<string>;
}
