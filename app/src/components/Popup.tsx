import type { ReactNode } from "react";

type Props = {
	message: string;
	children?: ReactNode;
	confirmLabel?: string;
	confirmStyle?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel?: () => void;
};

function Popup({
	message,
	children,
	confirmLabel = "yes",
	confirmStyle = "btn-sm btn-sm-stop",
	cancelLabel = "no",
	onConfirm,
	onCancel,
}: Props) {
	return (
		<div className="confirm-overlay">
			<div className="confirm">
				{message && <div className="speech">{message}</div>}
				{children}
				<div className="btn-row">
					<button type="button" className={confirmStyle} onClick={onConfirm}>
						{confirmLabel}
					</button>
					{onCancel && (
						<button type="button" className="btn-sm" onClick={onCancel}>
							{cancelLabel}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default Popup;
