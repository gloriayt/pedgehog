import Popup from "../Popup";

type Props = {
	onConfirm: () => void;
	onCancel: () => void;
};

function WalkDeleteConfirm({ onConfirm, onCancel }: Props) {
	return (
		<Popup
			message="Delete this walk?"
			onConfirm={onConfirm}
			onCancel={onCancel}
		/>
	);
}

export default WalkDeleteConfirm;
