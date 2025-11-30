import { useNavigate } from "react-router-dom"

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div>
        Unauthorized - Access Denied! <br />
      </div>
      <div>
        Please click Redirect to Login.
        <button className="bg-red-400 px-2 py-1 rounded text-white ml-2" onClick={() => navigate("/")}>
          Redirect{" "}
        </button>
      </div>
    </div>
  )
}

export default Unauthorized