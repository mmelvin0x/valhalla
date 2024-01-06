import { Dispatch, SetStateAction } from "react";
import { FaCalendarAlt } from "react-icons/fa";

interface SelectDateCardProps {
  unlockDate: number;
  setUnlockDate: Dispatch<SetStateAction<number>>;
  dates: {
    today: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyDays: number;
    oneThousandYears: number;
  };
}

export default function SelectDateCard({
  setUnlockDate,
  unlockDate,
  dates: { thirtyDays, sixtyDays, ninetyDays, oneThousandYears, today },
}: SelectDateCardProps) {
  return (
    <div className="card w-full">
      <div className="card-body">
        <div className="card-title">
          <FaCalendarAlt /> Pick an unlock date
        </div>

        <div className="form-control">
          <div className="label flex justify-end">
            <div className="label-text-alt flex gap-2">
              <button
                className={`btn btn-xs`}
                onClick={() => setUnlockDate(thirtyDays)}
              >
                30 Days
              </button>
              <button
                className={`btn btn-xs`}
                onClick={() => setUnlockDate(sixtyDays)}
              >
                60 Days
              </button>
              <button
                className={`btn btn-xs`}
                onClick={() => setUnlockDate(ninetyDays)}
              >
                90 Days
              </button>
              <button
                className={`btn btn-xs`}
                onClick={() => setUnlockDate(oneThousandYears)}
              >
                Valhalla
              </button>
            </div>
          </div>
          <input
            type="date"
            className="input input-bordered"
            min={new Date(today).toISOString().split("T")[0]}
            value={
              unlockDate
                ? new Date(unlockDate).toISOString().split("T")[0]
                : new Date(thirtyDays).toISOString().split("T")[0]
            }
            onChange={(e) => setUnlockDate(new Date(e.target.value).getTime())}
          />
        </div>
      </div>
    </div>
  );
}
