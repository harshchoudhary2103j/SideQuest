import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button/Button';
import { MascotDisplay } from '../components/mascot/MascotDisplay';
import styles from './NotFoundPage.module.css';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.mascotWrap}>
        <MascotDisplay
          expression="surprised"
          size="large"
          animation="float"
          speechBubble="404: Lost in the cosmos! 🌌"
        />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Quest Not Found</h1>
        <p className={styles.desc}>
          The trail went cold. This coordinate does not exist in our squad lore or portal logs.
        </p>
      </div>

      <Button
        variant="primary"
        size="md"
        leftIcon={<Home size={18} />}
        onClick={() => navigate('/app/squad')}
      >
        Return to Squad Base
      </Button>
    </div>
  );
};
