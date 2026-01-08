import * as Tooltip from "@radix-ui/react-tooltip";
import styles from "./TokenTooltip.module.css";

export function TokenTooltip({
                                 children,
                                 content,
                                 enabled = true
                             }: {
    children: React.ReactNode;
    content: React.ReactNode;
    enabled: boolean;
}) {
    return enabled ? (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                {children}
            </Tooltip.Trigger>

            <Tooltip.Portal>
                <Tooltip.Content
                    side="top"
                    align="center"
                    sideOffset={6}
                    className={styles.tooltip}
                >
                    {content}
                    <Tooltip.Arrow className={styles.tooltipArrow}/>
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    ) : <>{children}</>;
}
