export default function Logo({ className = "w-8 h-8", glow = true }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`w-full h-full text-crrfas-cyan ${glow ? 'drop-shadow-[0_0_12px_rgba(13,245,227,0.7)]' : ''}`}
            >
                {/* Minimalist Zen Ring (almost a full circle) */}
                <path
                    d="M 50 8 A 42 42 0 1 1 16 25"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="opacity-90"
                />

                {/* The "Z" and stylized nodes for ZencampuZ / Campus Tech */}
                <path
                    d="M 32 38 H 68 L 32 62 H 68"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Tech node dots */}
                <circle cx="32" cy="38" r="4" fill="#0DF5E3" />
                <circle cx="68" cy="62" r="4" fill="#0DF5E3" />
            </svg>
        </div>
    );
}
