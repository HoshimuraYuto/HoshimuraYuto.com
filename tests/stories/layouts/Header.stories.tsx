import { Meta, StoryObj } from "@storybook/react";

import Header from "../../../app/components/layouts/Header";

const meta = {
  title: "Layout/Header",
  component: Header,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ minWidth: "600px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
