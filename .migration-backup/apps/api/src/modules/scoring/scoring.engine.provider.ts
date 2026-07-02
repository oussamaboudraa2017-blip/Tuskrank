import { ScoringEngine } from './engine/scoring.engine';
import {
  IngredientQualityStrategy,
  TransparencyStrategy,
  NutritionalBalanceStrategy,
  ProcessingLevelStrategy,
  ControversialIngredientsStrategy,
  ScientificEvidenceStrategy,
  LabelTransparencyStrategy,
} from './strategies';

export const ScoringEngineProvider = {
  provide: ScoringEngine,
  useFactory: () =>
    new ScoringEngine([
      new IngredientQualityStrategy(),
      new TransparencyStrategy(),
      new NutritionalBalanceStrategy(),
      new ProcessingLevelStrategy(),
      new ControversialIngredientsStrategy(),
      new ScientificEvidenceStrategy(),
      new LabelTransparencyStrategy(),
    ]),
};