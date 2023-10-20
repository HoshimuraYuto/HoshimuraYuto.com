import { Meta, StoryContext, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "../../../app/components/elements/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../app/components/elements/Dropdown";

const meta = {
  title: "Component/Dropdown",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (
      _,
      context: StoryContext & {
        parameters: {
          align?: "start" | "center" | "end";
        };
      },
    ) => {
      const [value, setValue] = useState<number>(1);
      const handleValue = (value: number) => {
        setValue(value);
      };

      return (
        <div style={{ margin: "8rem" }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
              >
                {value}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={context.parameters.align}>
              <DropdownMenuItem onClick={() => handleValue(1)}>
                1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleValue(2)}>
                2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleValue(3)}>
                3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  ],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {
  parameters: {
    align: "start",
  },
};

export const End: Story = {
  parameters: {
    align: "end",
  },
};
