interface FormErrorProps {
  message?: string;
  id?: string;
}

export default function FormError({ message, id }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className="form-error" role="alert" id={id}>
      {message}
    </div>
  );
}
