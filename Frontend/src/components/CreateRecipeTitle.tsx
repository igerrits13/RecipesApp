import { Square, SquareCheck } from "lucide-react";
import { useState } from "react";

// CreateRecipeTitle component takes in and stores the title and inspiration information for a new recipe
export default function CreateRecipeTitle() {
  const [title, setTitle] = useState("");
  const [inspirationName, setInspirationName] = useState("");
  const [inspirationLink, setInspirationLink] = useState("");
  const [inspirationNotes, setInspirationNotes] = useState("");
  const [shareRecipe, setShareRecipe] = useState(false);

  return (
    <div className="px-4 py-2 flex flex-col place-items-center">
      <div className="flex place-self-end gap-1 items-center text-sage-olive-500">
        *Make Recipe Public
        <button
          className="place-items-center bg"
          onClick={() => setShareRecipe(!shareRecipe)}
        >
          {shareRecipe ? (
            <SquareCheck className="size-4 lg:size-6 text-rosewood-500" />
          ) : (
            <Square className="size-4 lg:size-6 text-rosewood-500" />
          )}
        </button>
      </div>
      <input
        id="title"
        name="title"
        className="grow w-full font-title focus:outline-none text-olive-500 text-2xl md:text-3xl lg:text-4xl"
        type="text"
        placeholder="*Recipe Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex w-full gap-1">
        Inspired by{" "}
        <input
          id="inspirationName"
          name="inspirationName"
          className="grow focus:outline-none text-olive-500"
          type="text"
          placeholder="Inspiration Name"
          value={inspirationName}
          onChange={(e) => setInspirationName(e.target.value)}
        />
      </div>
      <div className="flex w-full gap-1">
        Inspired by{" "}
        <input
          id="inspirationLink"
          name="inspirationLink"
          className="grow focus:outline-none text-olive-500"
          type="text"
          placeholder="Inspiration Link"
          value={inspirationLink}
          onChange={(e) => setInspirationLink(e.target.value)}
        />
      </div>
      <div className="flex w-full gap-1">
        Inspired by{" "}
        <input
          id="inspirationNotes"
          name="inspirationNotes"
          className="grow focus:outline-none text-olive-500"
          type="text"
          placeholder="Additional Notes"
          value={inspirationNotes}
          onChange={(e) => setInspirationNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
