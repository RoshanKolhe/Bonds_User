import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Paper,
} from '@mui/material';
import { m, AnimatePresence } from 'framer-motion';
import Image from 'src/components/image';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useSnackbar } from 'src/components/snackbar';
import { useRouter } from 'src/routes/hook';
import { setSession } from 'src/auth/context/jwt/utils';
import axiosInstance from 'src/utils/axios';

export default function MultiStepLoginDialog({ open, onClose }) {
  const [step, setStep] = useState('phone');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(Array(4).fill(''));
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [otpStarted, setOtpStarted] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const otpRefs = useRef([]);
  const router = useRouter();
  const RESEND_TIME = 30;

  const [timer, setTimer] = useState(RESEND_TIME);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };



  const handleVerifyEmailOtp = async () => {
    if (isVerifying) return;

    const code = otp.join("");
    if (code.length !== 4) return;

    setIsVerifying(true);


    const sessionId = localStorage.getItem("sessionId");

    try {
      const res = await axiosInstance.post(`/auth/verify-email-otp`, {
        sessionId,
        otp: code,
      });

      enqueueSnackbar(res.data?.message || "Email Verified!", {
        variant: "success",
      });

      // Close dialog if available
      onClose?.();

      // Redirect to next onboarding step
      router.push("/kyc/basic-info");
    } catch (err) {
      enqueueSnackbar(err?.error?.message || err.message, {
        variant: "error",
      });
    } finally {
      setIsVerifying(false);
    }
  };



  const handleSendEmailOtp = async () => {
    if (isSendingEmail) return;

    const emailValid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
    if (!emailValid) return;

    setIsSendingEmail(true);

    const sessionId = localStorage.getItem('sessionId');

    try {
      const res = await axiosInstance.post('/auth/send-email-otp', {
        sessionId,
        email,
      });

      enqueueSnackbar(res.data?.message || 'Email OTP Sent!', {
        variant: 'success',
      });

      // reset OTP input
      setOtp(Array(4).fill(''));
      setOtpStarted(false);

      // move to email OTP screen
      setStep('emailOtp');

      // 🔥 START RESEND TIMER (same as phone)
      startTimer();
    } catch (err) {
      enqueueSnackbar(
        err?.error?.message || 'Something went wrong!',
        { variant: 'error' }
      );
    } finally {
      setIsSendingEmail(false);
    }
  };





  const handleVerifyMobileOtp = async () => {
    if (isVerifying) return;

    const code = otp.join("");
    if (mobile.length !== 10 || code.length !== 4) return;

    setIsVerifying(true);

    // 🔹 Get saved sessionId
    const sessionId = localStorage.getItem("sessionId");

    try {
      const res = await axiosInstance.post(`/auth/verify-phone-otp`, {
        sessionId,
        otp: code,

      });

      enqueueSnackbar(res.data?.message || "Mobile Verified!", { variant: "success" });



      // 🔹 Proceed to collect user details
      setStep("details");
    } catch (err) {
      console.log(err);
      enqueueSnackbar(err.error?.message || "Something went wrong", { variant: "error" });
    } finally {
      setIsVerifying(false);
    }
  };


  const handleBack = () => {
    if (step === 'otp') setStep('phone');
    else if (step === 'details') setStep('otp');
    else if (step === 'emailOtp') setStep('details');
  };

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      if (value && !otpStarted) {
        const cleared = Array(4).fill('');
        cleared[index] = value;
        setOtp(cleared);
        setOtpStarted(true);
        if (index < cleared.length - 1) {
          otpRefs.current[index + 1]?.focus();
        }
        return;
      }
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < newOtp.length - 1) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const login_img = '/assets/images/issuer-login/login-img.png'; // replace with your image

  const handleGetMobileOtp = async () => {
    if (isSending || mobile.length !== 10) return;

    setIsSending(true);

    try {
      const res = await axiosInstance.post('/auth/send-phone-otp', {
        phone: mobile,
        role: 'company',
      });

      enqueueSnackbar(res.data?.message || 'OTP Sent!', { variant: 'success' });

      if (res.data?.sessionId) {
        localStorage.setItem('sessionId', res.data.sessionId);
      }

      setOtp(Array(4).fill(''));
      setOtpStarted(false);
      setStep('otp');

      startTimer();
    } catch (err) {
      enqueueSnackbar(err?.error?.message || 'Something went wrong', {
        variant: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };


  const handlePhoneResendOtp = async () => {
    if (!canResend || mobile.length !== 10) return;

    try {
      const res = await axiosInstance.post('/auth/send-phone-otp', {
        phone: mobile,
        role: 'company',
      });

      enqueueSnackbar('OTP resent successfully!', { variant: 'success' });

      if (res.data?.sessionId) {
        localStorage.setItem('sessionId', res.data.sessionId);
      }

      setOtp(Array(4).fill(''));
      otpRefs.current[0]?.focus();

      startTimer(); // 🔁 restart timer
    } catch (err) {
      enqueueSnackbar(
        err?.error?.message || 'Failed to resend OTP',
        { variant: 'error' }
      );
    }
  };

  const handleEmailResendOtp = async () => {
    if (!canResend) return;

    const emailValid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
    if (!emailValid) return;

    try {
      const sessionId = localStorage.getItem('sessionId');

      const res = await axiosInstance.post('/auth/send-email-otp', {
        sessionId,
        email,
        role: 'company',
      });

      enqueueSnackbar('Email OTP resent successfully!', { variant: 'success' });

      setOtp(Array(4).fill(''));
      otpRefs.current[0]?.focus();

      startTimer(); // 🔁 restart same timer
    } catch (err) {
      enqueueSnackbar(
        err?.error?.message || 'Failed to resend Email OTP',
        { variant: 'error' }
      );
    }
  };




  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <DialogContent sx={{ p: 0, zIndex: 1, backgroundColor: 'transparent' }}>
        <Paper
          sx={{
            display: 'flex',
            minHeight: 400,
            borderRadius: 0,
            backgroundColor: 'transparent',
          }}
        >
          {/* Left Side - Form Steps */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="wait">
              {step === 'phone' && (
                <m.div
                  key="phone"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                >

                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    Issuer Portal
                  </Typography>


                  <Typography sx={{ mb: 1 }}
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Sign In
                  </Typography>
                  <Typography variant="subtitle2"
                    color="text.secondary" sx={{ mb: 1 }}>
                    Aadhar linked mobile number
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => {
                      // Only allow numbers and limit to 10 digits
                      const numbers = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobile(numbers);
                    }}
                    InputProps={{
                      startAdornment: (
                        <Typography variant="body1" sx={{ mr: 1, color: 'text.primary' }}>
                          +91
                        </Typography>
                      ),
                    }}
                    sx={{ mb: 3, '& .MuiInputBase-input': { pl: 1 } }}
                  />

                  <Button
                    variant="contained"
                    onClick={handleGetMobileOtp}
                    disabled={mobile.length !== 10 || isSending}
                  >
                    Get OTP
                  </Button>

                  <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                    By continuing, you agree to our{' '}
                    <a href="#" style={{ color: '#1976d2' }}>
                      Privacy Policy
                    </a>{' '}
                    &{' '}
                    <a href="#" style={{ color: '#1976d2' }}>
                      Terms & Conditions
                    </a>
                  </Typography>
                </m.div>
              )}

              {step === 'otp' && (
                <m.div
                  key="otp"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                >
                  <Typography variant="subtitle2"
                    color="text.secondary" gutterBottom>
                    Enter OTP
                  </Typography>
                  <Typography variant="subtitle2"
                     sx={{ mb: 2 }}>We’ve sent an OTP to  <b>{mobile}</b> </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {otp.map((digit, i) => (
                      <Grid item xs={3} key={i}>
                        <TextField
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          inputRef={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otp[i] && i > 0) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                          inputProps={{
                            maxLength: 1,
                            style: { textAlign: 'center', fontSize: '1.5rem' },
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  <Typography textAlign="start" variant="body2" sx={{ mt: -1 }}>
                    {!canResend ? (
                      <>
                        Resend OTP after <b>{timer}</b> seconds
                      </>
                    ) : (
                      <>
                        Didn’t receive OTP?{' '}
                        <Button variant="text" onClick={handlePhoneResendOtp}>
                          Resend OTP
                        </Button>
                      </>
                    )}
                  </Typography>


                  <Box sx={{ mt: 4 }}>
                    <Button onClick={handleBack} sx={{ mr: 2 }}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleVerifyMobileOtp}
                      disabled={isVerifying || otp.join('').length !== 4}
                    >
                      Verify
                    </Button>
                  </Box>
                </m.div>
              )}

              {step === 'details' && (
                <m.div
                  key="details"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                >
                  <Typography  variant="subtitle2"
                    color="text.secondary" sx={{ mb: 1 }}>
                    Basic Details
                  </Typography>
                  <Typography variant="subtitle2"
                    color="text.secondary" sx={{ mb: 1 }}>
                    Important updates will be sent to this email
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  <Box>
                    <Button onClick={handleBack} sx={{ mr: 2 }}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSendEmailOtp}
                      disabled={
                        isSendingEmail || !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)
                      }
                    >
                      Get OTP
                    </Button>
                  </Box>
                </m.div>
              )}

              {step === 'emailOtp' && (
                <m.div
                  key="emailOtp"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                >
                  <Typography variant="subtitle2"
                    color="text.secondary" sx={{ mb: 1 }} >
                    Enter OTP
                  </Typography>
                  <Typography variant="subtitle2"
                    sx={{ mb: 1 }}>We’ve sent an OTP to {email}</Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {otp.map((digit, i) => (
                      <Grid item xs={3} key={i}>
                        <TextField
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          inputRef={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otp[i] && i > 0) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                          inputProps={{
                            maxLength: 1,
                            style: { textAlign: 'center', fontSize: '1.5rem' },
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                      If it hasn’t arrived, please check your spam folder
                    </Typography>

                    <Typography textAlign="start" variant="body2">
                      {!canResend ? (
                        <>
                          Resend OTP after <b>{timer}</b> seconds
                        </>
                      ) : (
                        <>
                          Didn’t receive OTP?{' '}
                          <Button variant="text" onClick={handleEmailResendOtp}>
                            Resend OTP
                          </Button>
                        </>
                      )}
                    </Typography>
                  </Box>



                  <Box sx={{ mt: 4 }}>
                    <Button onClick={handleBack} sx={{ mr: 2 }}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleVerifyEmailOtp}
                      disabled={isVerifying || otp.join('').length !== 4}
                    >
                      Verify
                    </Button>
                  </Box>
                </m.div>
              )}
            </AnimatePresence>
          </Box>

          {/* Right Side - Illustration */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              width: '45%',
              backgroundColor: 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            <Image src={login_img} alt="illustration" sx={{ width: '100%', maxWidth: '100%' }} />
          </Box>
        </Paper>
      </DialogContent>
      {/* 
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions> */}

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: '40%',
          width: '100%',
          height: '100%',
          display: { xs: 'none', md: 'flex' },
        }}
      >
        <Image
          src="/assets/images/issuer-login/background.png"
          alt="illustration"
          sx={{ width: '70%', height: '100%' }}
        />
      </Box>
    </Dialog>
  );
}
