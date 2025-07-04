import { ReactNode, useRef, useEffect } from 'react';

interface OutsideClickHandlerProps {
    onOutsideClick: () => any;
    children: ReactNode;
    disabled?: boolean;
    useCapture?: boolean;
}

export default function OutsideClickHandler({ onOutsideClick, children, disabled, useCapture }: OutsideClickHandlerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (disabled) {
            return;
        }
        function handle(event: MouseEvent | TouchEvent) {
            const element = containerRef.current;
            if (!element || element.contains(event.target as Node)) {
                return;
            }
            onOutsideClick();
        }
        document.addEventListener('mousedown', handle, useCapture);
        document.addEventListener('touchstart', handle, useCapture);
        return () => {
            document.removeEventListener('mousedown', handle, useCapture);
            document.removeEventListener('touchstart', handle, useCapture);
        };
    }, [onOutsideClick, disabled, useCapture]);

    return <div ref={containerRef}>{children}</div>;
}
