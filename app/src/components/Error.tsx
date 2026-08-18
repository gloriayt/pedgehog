type Props = {
	message: string;
	onDismiss: () => void;
};

function ErrorBanner({ message, onDismiss }: Props) {
	return (
		<div className="ds-error">
			{message}
			<button type="button" className="ds-error-close" onClick={onDismiss}>
				✕
			</button>
		</div>
	);
}

export default ErrorBanner;
