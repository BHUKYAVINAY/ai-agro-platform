
function Loading({ message = "Loading AGRO-AI..." }) {
    return (
        <div className="loading-screen" role="status">
            <div className="loading-spinner" />
            <p>{message}</p>
        </div>
    );
}

export default Loading;
