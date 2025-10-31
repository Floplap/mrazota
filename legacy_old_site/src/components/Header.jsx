import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useCart } from '@/hooks/useCart';

const Header = ({ setIsCartOpen }) => {
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Home', path: '/', implemented: true },
    { name: 'Store', path: '/store', implemented: true },
    { name: 'AI Tools', path: '/ai-tools', implemented: true },
    { name: 'Forum', path: '/forum', implemented: true },
    { name: 'Arcade', path: '/games', implemented: true },
  ];
  
  const handleNavClick = (e, item) => {
    setIsMenuOpen(false);
    
    if(item.implemented) {
        navigate(item.path);
        return;
    }

    e.preventDefault();
    toast({
      title: "🚧 Feature Under Development!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      variant: "default",
    });
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, type: 'spring', damping: 10, stiffness: 100 } },
    hover: { scale: 1.05, rotate: 5, transition: { duration: 0.3 } }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='sticky top-0 z-50 w-full backdrop-blur-lg bg-black/30 shadow-lg px-4 py-3 flex items-center justify-between border-b border-purple-500/30'
    >
      <div className='flex items-center space-x-4'>
        <NavLink to='/'>
          <motion.div
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className='flex items-center cursor-pointer'
          >
            <img src='/assets/legacy-logo.png' className='w-8 h-8 mr-2 glow-animation' alt='MRAZOTA logo - stylized angry girl head with blue, purple, and pink gradient hair' />
            <span className="text-2xl font-bold text-gradient font-['Orbitron',_sans-serif]">MRAZOTA</span>
          </motion.div>
        </NavLink>
      </div>

      <nav className='hidden md:flex space-x-6'>
        {navItems.map((item) => (
          <a
            key={item.name}
            href={item.path}
            className='text-lg font-medium text-gray-300 hover:text-white transition-colors duration-300 relative group'
            onClick={(e) => handleNavClick(e, item)}
          >
            {item.name}
            <motion.span
              className='absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'
            />
          </a>
        ))}
        {user && (
             <a
                key="Dashboard"
                href="/dashboard"
                className='text-lg font-medium text-gray-300 hover:text-white transition-colors duration-300 relative group'
                onClick={(e) => handleNavClick(e, { path: "/dashboard", implemented: true })}
              >
                Dashboard
                <motion.span
                  className='absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'
                />
              </a>
        )}
        {profile?.role === 'admin' && (
             <a
                key="Admin"
                href="/admin"
                className='text-lg font-medium text-red-400 hover:text-red-300 transition-colors duration-300 relative group'
                onClick={(e) => handleNavClick(e, { path: "/admin", implemented: true })}
              >
                Admin
                <motion.span
                  className='absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 to-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'
                />
              </a>
        )}
      </nav>

      <div className='flex items-center space-x-2'>
        <Button onClick={() => setIsCartOpen(true)} variant="ghost" className="relative text-white hover:bg-white/10">
          <ShoppingCart />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </Button>

        {user ? (
          <div className='hidden md:flex items-center space-x-2'>
            <Button variant='glass' onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant='destructive' onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className='hidden md:flex items-center space-x-2'>
            <Button variant='neon' onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant='glass' onClick={() => navigate('/signup')}>
              Register
            </Button>
          </div>
        )}
        <div className='md:hidden'>
          <Button variant='ghost' size='icon' onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className='h-6 w-6 text-white' /> : <Menu className='h-6 w-6 text-white' />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className='absolute top-[76px] left-0 w-full bg-black/80 backdrop-blur-md flex flex-col p-4 md:hidden border-b border-purple-500/30'
        >
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              className='py-2 text-lg font-medium text-gray-300 hover:text-white transition-colors duration-300'
              onClick={(e) => handleNavClick(e, item)}
            >
              {item.name}
            </a>
          ))}
          {user ? (
            <>
              <a href="/dashboard" className='py-2 text-lg font-medium text-gray-300 hover:text-white transition-colors duration-300' onClick={(e) => handleNavClick(e, { path: "/dashboard", implemented: true })}>Dashboard</a>
              {profile?.role === 'admin' && (
                <a href="/admin" className='py-2 text-lg font-medium text-red-400 hover:text-red-300 transition-colors duration-300' onClick={(e) => handleNavClick(e, { path: "/admin", implemented: true })}>Admin</a>
              )}
              <Button variant='destructive' className='mt-4 w-full' onClick={handleSignOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant='neon' className='mt-4 w-full' onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>
                Login
              </Button>
              <Button variant='glass' className='mt-2 w-full' onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}>
                Register
              </Button>
            </>
          )}
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;