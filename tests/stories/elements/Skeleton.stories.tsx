import { Meta, StoryObj } from "@storybook/react";

import Skeleton from "../../../app/components/elements/Skeleton";

const meta = {
  title: "Component/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    wrapperClassName: { control: "text" },
    className: { control: "text" },
    count: {
      control: "number",
    },
    circle: { control: "boolean" },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    className: "h-8 w-40 rd-4",
  },
};

export const TwoLines: Story = {
  args: {
    wrapperClassName: "flex flex-col gap-4",
    className: "h-8 w-40 rd-4",
    count: 2,
  },
};

export const Circle: Story = {
  args: {
    className: "h-8 w-8",
    circle: true,
  },
};
