import { Tip } from "catfix-utils/dist/scaners/types";
import React from "react";
import { useTranslation } from "react-i18next";
import parse from "html-react-parser";
import ScratchCode from "./ui/ScratchCode";
import { Divider, Space } from "antd";

interface tipItemProps {
  tip: Tip;
}

function TipItem({ tip }: tipItemProps) {
  const { t } = useTranslation();
  return (
    <div style={{ overflowX: "auto" }}>
      <Divider>{t(tip.title)}</Divider>
      <Space direction={"vertical"} align={"center"}>
        <p>{parse(t(tip.message, { ...tip.payload }))}</p>
        <div>{tip.code && <ScratchCode code={tip.code} />}</div>
      </Space>
    </div>
  );
}

export default TipItem;
