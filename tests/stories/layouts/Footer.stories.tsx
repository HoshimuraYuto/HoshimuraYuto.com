import { Meta, StoryObj } from "@storybook/react";

import Footer from "../../../app/components/layouts/Footer";

const meta = {
  title: "Layout/Footer",
  component: Footer,
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
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
