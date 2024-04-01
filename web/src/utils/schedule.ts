import BN from "bn.js";
import axios from "axios";
import { toast } from "react-toastify";

export const schedule = async (identifier: BN) => {
  const url =
    process.env.NEXT_PUBLIC_SCHEDULER_API_URL || "http://localhost:3001";

  try {
    const response = await axios.post(`${url}/schedule`, {
      identifier: identifier.toString(),
    });

    toast.success(response.data?.message);
  } catch (e) {
    toast.error("Failed to schedule vault!");
    console.error(e);
  }
};
