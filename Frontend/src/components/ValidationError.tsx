import { TriangleAlert } from "lucide-react";

export default function ValidationError({ message }: { message: string }) {
  return (
    <div className="text-rosewood-500 text-[14px]">
      <div className="flex items-center gap-1">
        <TriangleAlert className="size-4" /> {message}
      </div>
    </div>
  );
}
