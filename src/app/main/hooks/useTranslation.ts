import locale from '../../locale.config';

export default function useTranslation() {
  function translate(expression: string): string {
    return (
      expression.split(/\.|:/).reduce((translation, key) => {
        return translation?.[key];
      }, locale.json as any) || expression
    );
  }

  return translate;
}
