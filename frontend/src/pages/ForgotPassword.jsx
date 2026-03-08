import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    return (
        <div className="space-y-6 text-center">
            <p className="text-sm text-crrfas-muted">
                Enter your registered email address to receive password reset instructions.
            </p>

            <input
                type="email"
                className="input-field"
                placeholder="user@college.edu"
                required
            />

            <button className="btn-primary w-full mt-4">Reset Credentials</button>

            <div className="pt-4 border-t border-crrfas-surface">
                <Link to="/login" className="text-sm text-crrfas-muted hover:text-crrfas-cyan">
                    ← Return to Login
                </Link>
            </div>
        </div>
    );
}
