import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-screen">
      <div className="flex justify-center items-center h-full">
        <Loader className="animate-spin text-sage-olive-500 size-10" />
      </div>
    </div>
  );
}
