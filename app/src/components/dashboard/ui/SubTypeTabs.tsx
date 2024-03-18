import { Dispatch, SetStateAction } from "react";
import { FaArrowAltCircleDown, FaArrowAltCircleUp } from "react-icons/fa";

import BaseModel from "models/models";
import { SubType } from "utils/constants";

export default function SubTypeTabs({
  subType,
  setSubType,
  list,
}: {
  subType: SubType;
  setSubType: Dispatch<SetStateAction<SubType>>;
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
        onClick={() => setSubType(SubType.Receivable)}
        className={`tab flex items-center gap-1 ${subType === SubType.Receivable ? "tab-active" : ""}`}
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
