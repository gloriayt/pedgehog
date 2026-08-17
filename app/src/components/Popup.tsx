import type { ReactNode } from "react";

type Props = {
	message: string;
	children?: ReactNode;
	confirmLabel?: string;
	confirmStyle?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
};

function Popup({
	message,
	children,
	confirmLabel = "yes",
	confirmStyle = "ds-btn-sm ds-btn-sm-stop",
	cancelLabel = "no",
	onConfirm,
	onCancel,
}: Props) {
	return (
		<div className="ds-confirm-overlay">
			<div className="ds-confirm">
				<div className="ds-speech">{message}</div>
				{children}
				<div className="ds-btn-row">
					<button
						type="button"
						className={confirmStyle}
						onClick={onConfirm}
					>
						{confirmLabel}
					</button>
					<button type="button" className="ds-btn-sm" onClick={onCancel}>
						{cancelLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

export default Popup;
