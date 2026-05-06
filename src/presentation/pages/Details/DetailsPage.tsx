import React from 'react';
import { useParams } from 'react-router-dom';

const DetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1>Detalles</h1>
      <p>ID: {id}</p>
      <button>Reproducir</button>
    </div>
  );
};

export default DetailsPage;
