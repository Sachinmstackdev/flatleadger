import React from 'react';
import { User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { USERS } from '../data/users';

const Login: React.FC = () => {
  const { setCurrentUser } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">FlatLedger</h1>
          <p className="text-white/80 text-sm md:text-base">Choose your profile to continue</p>
        </div>

        <div className="space-y-4">
          {USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => setCurrentUser(user)}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-2xl p-3 md:p-4 transition-all duration-300 group active:scale-95"
            >
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 ${user.bgColor} rounded-xl flex items-center justify-center text-white text-lg md:text-xl group-hover:scale-110 transition-transform duration-300`}>
                  {user.avatar}
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold text-base md:text-lg">{user.name}</h3>
                  <p className="text-white/60 text-xs md:text-sm">Roommate</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-xs md:text-sm">
            Simple. Secure. No passwords needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;