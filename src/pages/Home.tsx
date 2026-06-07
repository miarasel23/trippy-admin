import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #e0f7fa, #b2ebf2);
`;

const Title = styled.h1`
  color: #006064;
`;

const Home: React.FC = () => (
  <Container>
    <Title>Welcome to the Dashboard</Title>
  </Container>
);

export default Home;
