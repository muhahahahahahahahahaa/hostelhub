import { useState } from 'react';
import {motion as Motion} from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { validateEmail, validatePassword } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/routePaths';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [formState, setFormState] = useState({
    loading: false,
    errors:{},
    showPassword: false,
    success: false
  })
  //handle input changes

  const handleInputChange =(e) =>{
    const {name, value } = e.target;
    setFormData(prev =>({
      ...prev,
      [name]: value
    }));
    //clear error when user starts typing
    if (formState.errors[name]){
      setFormState(prev =>({
        ...prev,
        errors: {...prev.errors, [name]: ''}
      }))
    }
  };
  const validateForm =() =>{
    const errors ={
      email: validateEmail(formData.email),
      password: validatePassword(formData.password)
    }

    //remove empty errors
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });
    setFormState(prev =>({...prev, errors}));
    return Object.keys(errors).length === 0
  };
  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormState(prev =>({...prev, loading:true}));
    try{
      //login api integration
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      setFormState(prev => ({
        ...prev,
        loading:false,
        success:true,
        errors: {}
      }));

      const {token, role} = response.data;

      if(token){
        login(response.data, token);

        //redirect based on role
        setTimeout(() => {
          window.location.href = 
            role === "owner"
              ? ROUTES.OWNER_DASHBOARD
              : ROUTES.FIND_HOSTELS;
        }, 2000);
      }
    }catch (error){
      setFormState(prev => ({
        ...prev,
        loading: false,
        errors: {
          submit:error.response?.data?.message || 'Login failed. Please check your credentials.'
        }
      }))
    }
  };
  if (formState.success){
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Motion.div
          initial={{opacity:0, scale:0.9}}
          animate={{opacity:1, scale:1}}
          className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Successful</h2>
          <p className="text-gray-600 mb-4">
            Redirecting you to your dashboard.
          </p>
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"/>
          <p className="text-sm text-gray-500 mt-2">Redirecting to your dashboard...</p>
        </Motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Motion.div
        initial={{ opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        transition={{duration:0.6}}
        className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Log In</h2>
          <p className="text-gray-600">Continue with your HostelHub account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/*email*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  formState.errors.email ? 'border-red-500': 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="Email address"
              />
            </div>
            {formState.errors.email &&(
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1"/>
                {formState.errors.email}
              </p>
            )}
          </div>
          {/*Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
              <input
                type={formState.showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                  formState.errors.password ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={()=> setFormState(prev=>({...prev,showPassword: !prev.showPassword}))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {formState.showPassword ? <EyeOff className="w-5 h-5"/>: <Eye className="w-5 h-5"/>}
              </button>
            </div>
            {formState.errors.password &&(
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1"/>
                {formState.errors.password}
              </p>
            )}
          </div>
          {/*Submit error */}
          {formState.errors.submit &&(
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm flex items-center">
                <AlertCircle className="w-4 h-2 mr-2" />
                {formState.errors.submit}
              </p>
            </div>
          )}
          {/*Submit Button */}
          <button
            type="submit"
            disabled={formState.loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {formState.loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin"/>
                <span>Logging In</span>
              </>
            ):(
              <span>Log In</span>
            )}
          </button>
          {/*sign up link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <a href={ROUTES.SIGNUP} className="text-blue-600 hover:text-blue-700 font-medium">
                Sign Up
              </a>
            </p>
          </div>
        </form>
      </Motion.div>
    </div>
  )
}

export default Login; 
