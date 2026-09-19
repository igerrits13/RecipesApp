// Props for the RecipeCardTemplate components contents
type RecipeCardTemplateProps = {
  cardContents: React.ReactNode;
};

// RecipeCardTemplate component that accepts children as props and renders a recipe card
export default function RecipeCardTemplate({
  cardContents,
}: RecipeCardTemplateProps) {
  return (
    <div className="flex flex-col relative items-center justify-center text-ink-black-500 bg-antique-parchment-500 h-85 w-full sm:w-90 rounded-4xl overflow-hidden">
      {cardContents}
    </div>
  );
}
