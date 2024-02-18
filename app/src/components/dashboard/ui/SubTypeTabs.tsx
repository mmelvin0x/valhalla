import { Dispatch, SetStateAction } from "react";
import { FaArrowAltCircleDown, FaArrowAltCircleUp } from "react-icons/fa";

import BaseModel from "models/models";
import { SubType } from "utils/constants";
import { VestingType } from "program";

export default function SubTypeTabs({
  subType,
  setSubType,
  vestingType,
  list,
}: {
  subType: SubType;
  setSubType: Dispatch<SetStateAction<SubType>>;
  vestingType: VestingType;
  list: { created: BaseModel[]; recipient: BaseModel[] };
}) {
  return (
    <div className="tabs tabs-boxed">
      <div
        onClick={() => setSubType(SubType.Created)}
        className={`tab flex items-center gap-2 ${subType === SubType.Created ? "tab-active" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">Created</span>{" "}
          <FaArrowAltCircleUp />
        </div>
        <div className="badge badge-info">{list.created.length}</div>
      </div>

      <div
        onClick={() =>
          vestingType !== VestingType.TokenLock &&
          setSubType(SubType.Receivable)
        }
        className={`tab flex items-center gap-1 ${subType === SubType.Receivable ? "tab-active" : ""} ${vestingType === VestingType.TokenLock ? "tab-disabled" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">Receivable</span>{" "}
          <FaArrowAltCircleDown />
        </div>
        <div className="badge badge-info">{list.recipient.length}</div>
      </div>
    </div>
  );
}
