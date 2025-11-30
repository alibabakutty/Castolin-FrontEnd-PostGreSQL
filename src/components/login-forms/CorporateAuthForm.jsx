import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import { useAuth } from '../../context/authConstants';

const CorporateAuthForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginCorporate } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // validation
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password!', {
        position: 'bottom-right',
        autoClose: 3000
      })
      setIsLoading(false);
      return;
    }

    try {
      // For login, use username as email if it contains '@' otherwise it's just username
      const loginEmail = username.includes('@') ? username : username;
      const result = await loginCorporate(loginEmail, password);

      if (result.success) {

        if (result.role === 'direct') {
          navigate('/corporate');
        } else if (result.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/unauthorized')
        }
      } else {
        toast.error(result.message || 'Login Failed!', {
          position: 'bottom-right',
          autoClose: 3000
        })
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. please try again.');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return username.trim() !== '' && password.trim() !== '';
  }

   return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-xl font-amasis text-white">
              Direct Order Login
            </h3>
            <p className="text-white/70 text-xs mt-1 font-amasis">
              Welcome back! Please login to continue
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-white/80 text-xs font-amasis mb-1">
                Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 outline-none focus:border-blue-400 text-sm font-amasis"
                placeholder="Enter your username or email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-white/80 text-xs font-amasis mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 outline-none focus:border-blue-400 text-sm font-amasis"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">

            <button
              type="submit"
              disabled={!isFormValid() || isLoading}
              className={`w-full py-2 rounded-lg font-semibold text-white transition-colors text-sm ${
                !isFormValid() || isLoading
                  ? 'bg-white/10 cursor-not-allowed text-white/50' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </div>
              ) : (
                "Login as Direct Order"
              )}
            </button>

            <div className="text-center">
              <p className="text-white/70 text-xs font-amasis">
                Don't have a direct order account?{" "}
                <span className="text-white/50 text-xs font-amasis">
                  Contact administrator
                </span>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CorporateAuthForm