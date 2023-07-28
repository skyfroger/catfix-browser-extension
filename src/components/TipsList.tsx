import React from "react";
import { Tip } from "catfix-utils/dist/scaners/types";
import { List } from "antd";
import TipItem from "./TipItem";

interface tipsListProps {
  tips: Tip[];
}

function TipsList({ tips }: tipsListProps) {
  return (
    <List
      pagination={{ pageSize: 3 }}
      dataSource={tips}
      renderItem={(item) => (
        <List.Item>
          <TipItem tip={item} />
        </List.Item>
      )}
    ></List>
  );
}

export default TipsList;
