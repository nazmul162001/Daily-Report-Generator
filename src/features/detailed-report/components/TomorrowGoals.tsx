import { BulletListEditor } from "./BulletListEditor";
import type { BulletItem } from "@/types/common";

interface TomorrowGoalsProps {
  items: BulletItem[];
  error?: string;
  onChange: (items: BulletItem[]) => void;
}

export function TomorrowGoals({ items, error, onChange }: TomorrowGoalsProps) {
  return (
    <BulletListEditor
      title="Goals for Tomorrow"
      idPrefix="tomorrow-goals"
      addLabel="Add goal"
      placeholder="Goal for tomorrow"
      items={items}
      error={error}
      onChange={onChange}
    />
  );
}
