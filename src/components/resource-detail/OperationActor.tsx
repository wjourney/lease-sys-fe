import {
  OperationIdentity,
  operationActorText,
} from "../../shared/operation-actor";
import { t } from "../../shared/i18n";

export function OperationActor({ actor }: { actor: OperationIdentity }) {
  return (
    <span className="whitespace-normal break-words leading-6 [overflow-wrap:anywhere]">
      {t(operationActorText(actor))}
    </span>
  );
}
