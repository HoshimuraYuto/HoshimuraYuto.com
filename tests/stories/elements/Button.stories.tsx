import { Meta, StoryObj } from "@storybook/react";

import { Button } from "../../../app/components/elements/Button";

const meta = {
  title: "Component/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: {
        type: "select",
        options: ["primary", "secondary", "outline", "ghost", "plain"],
      },
    },
    size: {
      control: {
        type: "select",
        options: ["sm", "base", "lg", "xl", "icon", "original"],
      },
    },
    disabled: { control: "boolean" },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    size: "base",
    children: <>Button</>,
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    size: "base",
    children: <>Button</>,
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    size: "base",
    children: <>Button</>,
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    size: "base",
    children: <>Button</>,
  },
};

export const Plain: Story = {
  args: {
    variant: "plain",
    size: "base",
    children: <>Button</>,
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    size: "base",
    disabled: true,
    children: <>Button</>,
  },
};

export const Icon: Story = {
  args: {
    variant: "outline",
    size: "icon",
    children: <div className="i-carbon-sun dark:i-carbon-moon" />,
  },
};

export const WithIcon: Story = {
  args: {
    variant: "outline",
    children: (
      <>
        HOME
        <div className="i-carbon-sun dark:i-carbon-moon" />
      </>
    ),
  },
};
