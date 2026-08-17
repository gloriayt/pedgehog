type Props = {
	onConfirm: () => void;
	onCancel: () => void;
};

function WalkDeleteConfirm({ onConfirm, onCancel }: Props) {
	return (
		<div className="ds-confirm-overlay">
			<div className="ds-confirm">
				<div className="ds-speech">Delete this walk?</div>
				<div className="ds-btn-row">
					<button
						type="button"
						className="ds-btn-sm ds-btn-sm-stop"
						onClick={onConfirm}
					>
						DELETE
					</button>
					<button
						type="button"
						className="ds-btn-sm"
						onClick={onCancel}
					>
						CANCEL
					</button>
				</div>
			</div>
		</div>
	);
}

export default WalkDeleteConfirm;
