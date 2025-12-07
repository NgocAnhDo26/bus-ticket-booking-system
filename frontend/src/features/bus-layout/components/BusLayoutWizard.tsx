import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useShallow } from "zustand/react/shallow";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useBusLayoutStore } from "../store/useBusLayoutStore";
import { useCreateBusLayout, useUpdateBusLayout } from "../hooks";
import { LayoutConfigForm } from "./LayoutConfigForm";
import { SeatMapEditor } from "./SeatMapEditor";

interface BusLayoutWizardProps {
  layoutId?: string;
}

export const BusLayoutWizard = ({ layoutId }: BusLayoutWizardProps) => {
  const navigate = useNavigate();
  const {
    step,
    setStep,
    resetStore,
    config,
    seats,
  } = useBusLayoutStore(
    useShallow((state) => ({
      step: state.step,
      setStep: state.setStep,
      resetStore: state.resetStore,
      config: state.config,
      seats: state.seats,
    }))
  );

  const createLayout = useCreateBusLayout();
  const updateLayout = useUpdateBusLayout();

  const handleSave = () => {
    if (layoutId) {
      updateLayout.mutate(
        {
          id: layoutId,
          data: {
            config,
            seats,
          },
        },
        {
          onSuccess: () => {
            resetStore();
            setStep(1);
            navigate("/admin/catalog/layouts");
          },
        },
      );
    } else {
      createLayout.mutate(
        {
          config,
          seats,
        },
        {
          onSuccess: () => {
            resetStore();
            setStep(1);
            navigate("/admin/catalog/layouts");
          },
        },
      );
    }
  };

  const isPending = createLayout.isPending || updateLayout.isPending;
  const error = createLayout.error || updateLayout.error;

  useEffect(() => {
    if (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể lưu layout, vui lòng thử lại.",
      );
    }
  }, [error]);

  return (
    <div className="space-y-4 flex justify-center">
      {step === 1 ? (
        <LayoutConfigForm onComplete={() => setStep(2)} className="max-w-lg" />
      ) : (
        <div className="space-y-4">
          <SeatMapEditor />
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Quay lại cấu hình
              </Button>
              {!layoutId && <Button variant="ghost" onClick={resetStore}>
                Làm lại từ đầu
              </Button>}
            </div>
            <Button
              onClick={handleSave}
              disabled={isPending || seats.length === 0}
            >
              {isPending ? "Đang lưu..." : (layoutId ? "Cập nhật layout" : "Lưu layout")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
