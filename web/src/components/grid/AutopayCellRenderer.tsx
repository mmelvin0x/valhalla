import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";

import { ICellRendererParams } from "ag-grid-community";

const AutopayCellRenderer = (params: ICellRendererParams) => {
  return (
    <div className="h-10 flex flex-col items-center justify-center">
      {params.value ? (
        <IconCircleCheck className="text-success" />
      ) : (
        <IconCircleX className="text-error" />
      )}
    </div>
  );
};

export default AutopayCellRenderer;
