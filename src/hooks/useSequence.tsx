import { useEffect, useRef, useState } from "react";

export const SequenceEnum = {
  admin: "@admin",
};

export function useSequence() {
  const [sequence, setSequence] = useState("");
  const [text, setText] = useState("");
  const [isText, setIsText] = useState(false);

  const seqRef = useRef("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const targetSeq = SequenceEnum.admin;
      if (key === targetSeq.charAt(0) && seqRef.current == "") {
        seqRef.current = targetSeq.substring(1);
        setSequence("");
        setText((prev) => (prev += key));
      } else if (seqRef.current) {
        if (key === seqRef.current.charAt(0)) {
          seqRef.current = seqRef.current.substring(1);
          setText((prev) => (prev += key));

          if (seqRef.current.length === 0) {
            setSequence(() => targetSeq);
            seqRef.current = "";
            setText(() => "");
            setIsText(false);
          }
        } else {
          seqRef.current = "";
          setText(() => "");
          setIsText(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  console.log("rj-sequence", { sequence, text, seqRef: seqRef?.current });
  // if (text?.length)
  //   return (
  //     <Box
  //       sx={{
  //         position: 'fixed',
  //         bottom: '20px',
  //         left: '45%',
  //         zIndex: 9999,
  //         display: 'flex',
  //         gap: '5px',
  //         backgroundColor: 'aliceblue',
  //         padding: '10px',
  //         borderRadius: '6px',
  //         alignItems: 'center'
  //       }}>
  //       <input
  //         type={isText ? 'text' : 'password'}
  //         style={{ padding: '5px' }}
  //         disabled
  //         value={text}
  //       />
  //       <RemoveRedEyeOutlinedIcon
  //         color="disabled"
  //         fontSize="small"
  //         onClick={() => setIsText((prev) => !prev)}
  //       />
  //     </Box>
  //   );
  return sequence;
}
