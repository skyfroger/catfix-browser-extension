import { Tip } from "catfix-utils/dist/scaners/types";
import React from "react";
import { useTranslation } from "react-i18next";
import ScratchCode from "./ui/ScratchCode";

interface tipItemProps {
  tip: Tip;
}

function TipItem({ tip }: tipItemProps) {
  const { t } = useTranslation();
  return (
    <>
      <p>{t(tip.message, tip.payload)}</p>
      <p>{tip.code && <ScratchCode code={tip.code} />}</p>
    </>
  );
}

export default TipItem;
