import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen w-full">

        {/* =================================================
            SIDEBAR / MOBILE NAVIGATION
            ================================================= */}

        <Sidebar />

        {/* =================================================
            MAIN CONTENT
            ================================================= */}

        <main
          className="
            flex-1
            min-w-0
            w-full
            relative
            lg:ml-72
            pt-16
            sm:pt-[72px]
            lg:pt-0
          "
        >

          {/* =================================================
              SUBTLE BACKGROUND GRID
              ================================================= */}

          <div
            className="
              absolute
              inset-0
              pointer-events-none
              opacity-40
            "
            style={{
              backgroundImage: `
                linear-gradient(
                  var(--bg-pattern) 1px,
                  transparent 1px
                ),
                linear-gradient(
                  90deg,
                  var(--bg-pattern) 1px,
                  transparent 1px
                )
              `,
              backgroundSize: '32px 32px',
            }}
          />

          {/* =================================================
              MAIN WORKSPACE
              ================================================= */}

          <div
            className="
              relative
              z-10
              w-full
              px-4
              py-5
              sm:px-6
              sm:py-7
              md:px-8
              lg:px-10
              lg:py-10
            "
          >
            <div
              className="
                w-full
                max-w-[1500px]
                mx-auto
                min-w-0
              "
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  className="w-full min-w-0"
                  initial={{
                    opacity: 0,
                    y: 6,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                  }}
                  transition={{
                    duration: 0.18,
                    ease: 'easeOut',
                  }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
