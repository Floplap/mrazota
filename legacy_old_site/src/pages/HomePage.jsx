// React automatic runtime in use; no default React import required
import { motion } from 'framer-motion';
import { Sparkles, Brain, MessageSquare, ListTodo, ArrowRight, Gamepad2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
const HomePage = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const features = [{
    name: 'AI Tools',
    icon: Brain,
    description: 'Chat and generate ideas',
    color: 'purple'
  }, {
    name: 'Notes',
    icon: ListTodo,
    description: 'Save and organize your thoughts',
    color: 'pink'
  }, {
    name: 'Forum & Chat',
    icon: MessageSquare,
    description: 'Connect and share',
    color: 'yellow'
  }, {
    name: 'Arcade',
    icon: Gamepad2,
    description: 'Play classic mini-games',
    color: 'green'
  }];
  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };
  const handleExplore = () => {
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };
  return <motion.div className='flex flex-col items-center justify-center text-center py-12 px-4' variants={containerVariants} initial='hidden' animate='visible'>
      <Helmet>
        <title>Welcome to MRAZOTA - Your Creative Hub</title>
        <meta name="description" content="MRAZOTA: The ultimate online hub for creativity, AI tools, community, and personal utilities. Fast, intuitive, and visually futuristic." />
      </Helmet>

      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 animated-bg"></div>
        <motion.div variants={itemVariants} className="mb-8 z-10">
          <img className='w-32 h-32 md:w-40 md:h-40 mx-auto glow-animation' src='/assets/legacy-logo.png' alt='MRAZOTA logo - stylized angry girl head with blue, purple, and pink gradient hair' />
        </motion.div>

        <motion.h1 className="text-4xl md:text-6xl font-bold text-gradient mb-4 font-['Orbitron',_sans-serif] z-10" variants={itemVariants}>MRAZOTA</motion.h1>
        <motion.p className='text-lg md:text-xl text-gray-300 max-w-3xl mb-8 z-10' variants={itemVariants}>Mind Resources Arena Zone Open Tools & Activity</motion.p>
        <motion.div className="flex flex-col sm:flex-row gap-4 z-10" variants={itemVariants}>
            <Button size="lg" variant="neon" onClick={handleGetStarted}>
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="glass" onClick={handleExplore}>Features</Button>
        </motion.div>
      </div>

      <motion.div id="features" className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 my-24 w-full max-w-4xl' variants={containerVariants}>
        {features.map(feature => <motion.div key={feature.name} className={`p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-${feature.color}-500/30 shadow-lg flex flex-col items-center text-center hover:border-${feature.color}-400 transition-all duration-300 group`} variants={itemVariants} whileHover={{
        y: -10,
        scale: 1.03
      }}>
            <div className={`p-4 rounded-full bg-gradient-to-br from-${feature.color}-500/20 to-transparent mb-4`}>
                <feature.icon className={`w-12 h-12 text-${feature.color}-400 group-hover:text-${feature.color}-300 transition-colors`} />
            </div>
            <h2 className='text-2xl font-bold mb-2 text-white'>{feature.name}</h2>
            <p className='text-gray-400'>{feature.description}</p>
          </motion.div>)}
      </motion.div>

      <motion.div className="w-full max-w-4xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-8 rounded-2xl border border-purple-500/30 flex flex-col md:flex-row items-center gap-8" variants={itemVariants}>
        <Sparkles className="w-16 h-16 text-purple-400 shrink-0" />
        <div>
            <h2 className="text-3xl font-bold text-gradient mb-2 font-['Orbitron',_sans-serif]">Level Up Your Experience</h2>
            <p className="text-gray-300">Earn XP by being active — the more you use AI tools, and contribute to the forum, the more you grow. Unlock achievements, customize your profile, and climb the leaderboards!</p>
        </div>
      </motion.div>

    </motion.div>;
};
export default HomePage;