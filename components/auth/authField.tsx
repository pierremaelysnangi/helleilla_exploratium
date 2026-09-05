/**
 * Primitives de formulaire des pages d'authentification.
 *
 * Ce ne sont plus que des ALIAS : le rendu vit dans
 * `components/shared/formField.tsx`, les écrans d'édition du catalogue
 * posant exactement les mêmes questions. Les quatre formulaires
 * d'authentification gardent leurs noms d'origine, plus parlants dans
 * leur contexte.
 */

export {
  FIELD_CLASS,
  FormField as AuthField,
  SubmitButton as AuthSubmit,
  FormError as AuthError,
} from "@/components/shared/formField";
