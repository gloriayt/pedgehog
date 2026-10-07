type Props = {
	message: string;
	onDismiss: () => void;
};

function ErrorBanner({ message, onDismiss }: Props) {
	return (
		<div className="error">
			{message}
			<button type="button" className="error-close" onClick={onDismiss}>
				✕
			</button>
		</div>
	);
}

export default ErrorBanner;
