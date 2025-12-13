import { useState } from 'react';
import { m } from 'framer-motion';
// @mui
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
// components
import { RouterLink } from 'src/routes/components';
import { MotionContainer, varFade } from 'src/components/animate';
import MultiStepLoginDialog from '../user/issuer-login';

// ----------------------------------------------------------------------
const StyledHero = styled('div')(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',

  padding: theme.spacing(10),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
}));
const StyledContent = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2.5),
  [theme.breakpoints.only('md')]: {
    padding: theme.spacing(0, 5),
  },
}));

export default function HomeHero() {
  const [openLogin, setOpenLogin] = useState(false);
    const theme = useTheme();

  return (
    <Box
      component='div'
      sx={{
        mt: { xs: 0 },
        width: '100%',
        height: 'auto',
        position: 'relative',

      }}
    >

      {/* md:5 */}
      <Box
        component="img"
        src="/assets/images/issuer/hero/hero.png"
        alt="Hero Background"
        sx={{
          width: '100%',
          height: { xs: 425, md: 'auto' },
          objectFit: { xs: 'none', md: 'cover' },
          display: 'block',
        }}
      />
      <Container
        sx={{
          position: 'absolute',
          top: '50%',
          right: { md: 170 },
          left: 0,
          zIndex: 10,
          transform: 'translateY(-50%)', // <-- This centers vertically
        }}>
        <StyledHero>
          <Grid container spacing={5} alignItems="center">
            <Grid xs={12} md={8}>
              <MotionContainer>
                <StyledContent>
                  <m.div variants={varFade().inUp}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        mb: 3,
                      }}
                    >
                      Welcome to BondIssuer Pro
                    </Typography>
                  </m.div>

                  <m.div variants={varFade().inUp}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 400,
                        color: 'text.secondary',
                        mb: 5,
                      }}
                    >
                      Register your company in minutes and access global capital markets with
                      AI-powered insights
                    </Typography>
                  </m.div>

                  <m.div variants={varFade().inUp}>
                    <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
                      <Button
                        variant="contained"
                        size="large"
                        color="primary"
                        onClick={() => setOpenLogin(true)}
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontStyle: 'bold',
                          fontSize: '14px',
                          px: '24px',
                          py: '6px',
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                          },
                        }}

                      >
                        Start Registration
                      </Button>
                      <MultiStepLoginDialog
                        open={openLogin}
                        onClose={() => setOpenLogin(false)}
                      />
                      <Button
                        component={RouterLink}
                        href="/about-us"
                        variant="outlined"
                        size="large"
                        sx={{
                          bgcolor: '#FFFFFF',
                          color: '#000000',
                          borderRadius: '10px',
                          px: 4,
                          '&:hover': {
                            bgcolor: '#F5F5F5',
                            color: '#000000',
                          },
                        }}
                      >
                        Learn More About Us
                      </Button>
                    </Stack>
                  </m.div>
                </StyledContent>
              </MotionContainer>
            </Grid>

            <Grid xs={12} md={4}>
              <m.div
                variants={varFade().inUp}
                style={{
                  display: 'flex',
                  justifyContent: { md: 'flex-end', xs: 'center' },
                  width: '100%',
                  height: '100%',
                }}
              >
                {/* <Box
                component="img"
                src="/assets/images/issuer/hero/hand_shake.png"
                alt="Hand shake"
                sx={{
                  maxWidth: '100%',
                  height: { md: '300px', xs: 'auto' },
                  objectFit: 'contain',
                  display: 'block',
                  mt: { xs: 5, md: 0 },
                }}
              /> */}
              </m.div>
            </Grid>
          </Grid>
        </StyledHero>
      </Container>
    </Box >
  );
}
