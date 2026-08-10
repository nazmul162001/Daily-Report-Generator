import { BulletListEditor } from "./BulletListEditor";
import type { BulletItem } from "@/types/common";

interface GoalReviewProps {
  items: BulletItem[];
  error?: string;
  onChange: (items: BulletItem[]) => void;
}

export function GoalReview({ items, error, onChange }: GoalReviewProps) {
  return (
    <BulletListEditor
      title="Goal Review"
      idPrefix="goal-review"
      addLabel="Add goal"
      items={items}
      error={error}
      onChange={onChange}
    />
  );
}
